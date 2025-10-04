/**
 * ZeroOS Task Extension Component
 * 
 * Displays and manages ZeroOS-specific task extensions.
 * Handles workspace, associated people, companies, and Gmail threads.
 */

'use client';

import React, { useCallback, useState } from 'react';
import type { ZeroosTaskExtension } from '../types/task';

export interface ZeroosTaskExtensionProps {
    extension: ZeroosTaskExtension;
    onUpdate: (data: Partial<ZeroosTaskExtension>) => void;
}

export function ZeroosTaskExtension({
    extension,
    onUpdate
}: ZeroosTaskExtensionProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        workspace: extension.workspace || '',
        associatedPeople: extension.associatedPeople || [],
        associatedCompanies: extension.associatedCompanies || [],
        linkedGmailThreads: extension.linkedGmailThreads || [],
        internalNotes: extension.internalNotes || '',
        tags: extension.tags || []
    });
    const [newPerson, setNewPerson] = useState('');
    const [newCompany, setNewCompany] = useState('');
    const [newTag, setNewTag] = useState('');

    // Handle form change
    const handleFormChange = useCallback((field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    // Handle save
    const handleSave = useCallback(() => {
        onUpdate(formData);
        setIsEditing(false);
    }, [formData, onUpdate]);

    // Handle cancel
    const handleCancel = useCallback(() => {
        setFormData({
            workspace: extension.workspace || '',
            associatedPeople: extension.associatedPeople || [],
            associatedCompanies: extension.associatedCompanies || [],
            linkedGmailThreads: extension.linkedGmailThreads || [],
            internalNotes: extension.internalNotes || '',
            tags: extension.tags || []
        });
        setIsEditing(false);
    }, [extension]);

    // Handle add person
    const handleAddPerson = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && newPerson.trim()) {
            e.preventDefault();
            const currentPeople = formData.associatedPeople;
            if (!currentPeople.includes(newPerson.trim())) {
                handleFormChange('associatedPeople', [...currentPeople, newPerson.trim()]);
            }
            setNewPerson('');
        }
    }, [newPerson, formData.associatedPeople, handleFormChange]);

    // Handle remove person
    const handleRemovePerson = useCallback((person: string) => {
        handleFormChange('associatedPeople', formData.associatedPeople.filter(p => p !== person));
    }, [formData.associatedPeople, handleFormChange]);

    // Handle add company
    const handleAddCompany = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && newCompany.trim()) {
            e.preventDefault();
            const currentCompanies = formData.associatedCompanies;
            if (!currentCompanies.includes(newCompany.trim())) {
                handleFormChange('associatedCompanies', [...currentCompanies, newCompany.trim()]);
            }
            setNewCompany('');
        }
    }, [newCompany, formData.associatedCompanies, handleFormChange]);

    // Handle remove company
    const handleRemoveCompany = useCallback((company: string) => {
        handleFormChange('associatedCompanies', formData.associatedCompanies.filter(c => c !== company));
    }, [formData.associatedCompanies, handleFormChange]);

    // Handle add tag
    const handleAddTag = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && newTag.trim()) {
            e.preventDefault();
            const currentTags = formData.tags;
            if (!currentTags.includes(newTag.trim())) {
                handleFormChange('tags', [...currentTags, newTag.trim()]);
            }
            setNewTag('');
        }
    }, [newTag, formData.tags, handleFormChange]);

    // Handle remove tag
    const handleRemoveTag = useCallback((tag: string) => {
        handleFormChange('tags', formData.tags.filter(t => t !== tag));
    }, [formData.tags, handleFormChange]);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900">ZeroOS Details</h4>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                    >
                        Edit
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="space-y-4">
                {/* Workspace */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Workspace
                    </label>
                    {isEditing ? (
                        <input
                            type="text"
                            value={formData.workspace}
                            onChange={(e) => handleFormChange('workspace', e.target.value)}
                            placeholder="Enter workspace"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    ) : (
                        <p className="text-sm text-gray-900">
                            {extension.workspace || 'No workspace assigned'}
                        </p>
                    )}
                </div>

                {/* Associated People */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Associated People
                    </label>
                    {isEditing ? (
                        <div className="space-y-2">
                            <input
                                type="text"
                                value={newPerson}
                                onChange={(e) => setNewPerson(e.target.value)}
                                onKeyDown={handleAddPerson}
                                placeholder="Add person and press Enter"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            {formData.associatedPeople.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {formData.associatedPeople.map((person, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                                        >
                                            {person}
                                            <button
                                                onClick={() => handleRemovePerson(person)}
                                                className="ml-1 text-green-600 hover:text-green-800"
                                            >
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {extension.associatedPeople.length > 0 ? (
                                extension.associatedPeople.map((person, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                                    >
                                        {person}
                                    </span>
                                ))
                            ) : (
                                <span className="text-sm text-gray-500">No people associated</span>
                            )}
                        </div>
                    )}
                </div>

                {/* Associated Companies */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Associated Companies
                    </label>
                    {isEditing ? (
                        <div className="space-y-2">
                            <input
                                type="text"
                                value={newCompany}
                                onChange={(e) => setNewCompany(e.target.value)}
                                onKeyDown={handleAddCompany}
                                placeholder="Add company and press Enter"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            {formData.associatedCompanies.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {formData.associatedCompanies.map((company, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                        >
                                            {company}
                                            <button
                                                onClick={() => handleRemoveCompany(company)}
                                                className="ml-1 text-blue-600 hover:text-blue-800"
                                            >
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {extension.associatedCompanies.length > 0 ? (
                                extension.associatedCompanies.map((company, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                    >
                                        {company}
                                    </span>
                                ))
                            ) : (
                                <span className="text-sm text-gray-500">No companies associated</span>
                            )}
                        </div>
                    )}
                </div>

                {/* Tags */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tags
                    </label>
                    {isEditing ? (
                        <div className="space-y-2">
                            <input
                                type="text"
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                onKeyDown={handleAddTag}
                                placeholder="Add tag and press Enter"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            {formData.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {formData.tags.map((tag, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                                        >
                                            {tag}
                                            <button
                                                onClick={() => handleRemoveTag(tag)}
                                                className="ml-1 text-purple-600 hover:text-purple-800"
                                            >
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {extension.tags.length > 0 ? (
                                extension.tags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                                    >
                                        {tag}
                                    </span>
                                ))
                            ) : (
                                <span className="text-sm text-gray-500">No tags</span>
                            )}
                        </div>
                    )}
                </div>

                {/* Internal Notes */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Internal Notes
                    </label>
                    {isEditing ? (
                        <textarea
                            value={formData.internalNotes}
                            onChange={(e) => handleFormChange('internalNotes', e.target.value)}
                            placeholder="Enter internal notes"
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    ) : (
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">
                            {extension.internalNotes || 'No internal notes'}
                        </p>
                    )}
                </div>
            </div>

            {/* Actions */}
            {isEditing && (
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                        onClick={handleCancel}
                        className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Save
                    </button>
                </div>
            )}
        </div>
    );
}
